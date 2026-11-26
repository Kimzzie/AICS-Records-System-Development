<?php

namespace Tests\Feature\Api;

use App\Models\SystemSetting;
use App\Models\TransactionDraft;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class TransactionDraftTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_each_role_lists_only_its_own_draft_summaries_without_form_contents(): void
    {
        $staff = $this->userWithRole('Staff');
        $seniorStaff = $this->userWithRole('Senior staff');
        $administrator = $this->userWithRole('Administrator');

        $staffDraft = $this->createDraft($staff, 'Staff requester');
        $seniorDraft = $this->createDraft($seniorStaff, 'Senior requester');
        $administratorDraft = $this->createDraft($administrator, 'Administrator requester');

        foreach ([
            [$staff, $staffDraft],
            [$seniorStaff, $seniorDraft],
            [$administrator, $administratorDraft],
        ] as [$owner, $ownedDraft]) {
            $list = $this->actingAs($owner, 'sanctum')->getJson('/api/v1/drafts')->assertOk();
            $this->assertIsArray($list->json('data'), 'Draft list must return a data array.');
            $this->assertCount(1, $list->json('data'));
            $this->assertSame($ownedDraft->id, $list->json('data.0.id'));
            $this->assertSame($ownedDraft->client_name, $list->json('data.0.client_name'));
            $this->assertArrayNotHasKey('form_data', $list->json('data.0'));
        }
    }

    public function test_creator_can_create_view_update_and_delete_a_full_form_draft(): void
    {
        $creator = $this->userWithRole('Senior staff');
        $formData = $this->formSnapshot('Draft Requester');

        $created = $this->actingAs($creator, 'sanctum')
            ->postJson('/api/v1/drafts', [
                'client_name' => 'Draft Requester',
                'beneficiary_name' => 'Draft Beneficiary',
                'assistance' => 'Medical',
                'form_data' => $formData,
                'last_saved_at' => '2000-01-01 00:00:00',
            ])
            ->assertCreated()
            ->assertJsonPath('data.client_name', 'Draft Requester')
            ->assertJsonPath('data.beneficiary_name', 'Draft Beneficiary')
            ->assertJsonPath('data.form_data.schema_version', 1);

        $draftId = $created->json('data.id');
        $this->assertNotNull($created->json('data.last_saved_at'));
        $this->assertNotSame('2000-01-01 00:00:00', $created->json('data.last_saved_at'));

        $this->actingAs($creator, 'sanctum')
            ->getJson('/api/v1/drafts/'.$draftId)
            ->assertOk()
            ->assertJsonPath('data.form_data.transaction.client.full_name', 'Draft Requester')
            ->assertJsonPath('data.form_data.fields.cBarangay.value', 'North Poblacion');

        $updated = $this->formSnapshot('Updated Requester');
        $this->actingAs($creator, 'sanctum')
            ->putJson('/api/v1/drafts/'.$draftId, [
                'client_name' => 'Updated Requester',
                'beneficiary_name' => 'Updated Beneficiary',
                'assistance' => 'Burial',
                'form_data' => $updated,
            ])
            ->assertOk()
            ->assertJsonPath('data.client_name', 'Updated Requester')
            ->assertJsonPath('data.form_data.transaction.client.full_name', 'Updated Requester');

        $this->actingAs($creator, 'sanctum')
            ->deleteJson('/api/v1/drafts/'.$draftId)
            ->assertOk();

        $this->assertDatabaseMissing('transaction_drafts', ['id' => $draftId]);
    }

    public function test_another_staff_member_and_an_administrator_cannot_view_update_or_delete_a_draft(): void
    {
        $owner = $this->userWithRole('Staff');
        $otherStaff = $this->userWithRole('Senior staff');
        $administrator = $this->userWithRole('Administrator');
        $draft = $this->createDraft($owner, 'Private requester');

        foreach ([$otherStaff, $administrator] as $otherUser) {
            $this->actingAs($otherUser, 'sanctum')
                ->getJson('/api/v1/drafts/'.$draft->id)
                ->assertNotFound();

            $this->actingAs($otherUser, 'sanctum')
                ->putJson('/api/v1/drafts/'.$draft->id, [
                    'client_name' => 'Attempted change',
                    'form_data' => $this->formSnapshot('Attempted change'),
                ])
                ->assertNotFound();

            $this->actingAs($otherUser, 'sanctum')
                ->deleteJson('/api/v1/drafts/'.$draft->id)
                ->assertNotFound();
        }

        $this->assertDatabaseHas('transaction_drafts', [
            'id' => $draft->id,
            'user_id' => $owner->id,
            'client_name' => 'Private requester',
        ]);
    }

    public function test_draft_creation_and_update_require_a_versioned_form_snapshot(): void
    {
        $creator = $this->userWithRole('Staff');

        $this->actingAs($creator, 'sanctum')
            ->postJson('/api/v1/drafts', [
                'client_name' => 'Incomplete',
                'form_data' => ['fields' => []],
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'form_data.schema_version',
                'form_data.transaction',
                'form_data.fields',
            ]);
    }

    public function test_expired_drafts_are_pruned_using_configured_retention_and_updated_at_fallback(): void
    {
        Carbon::setTestNow('2026-11-25 12:00:00');
        SystemSetting::updateOrCreate(
            ['key' => 'keepDraftsDays'],
            ['value' => ['value' => 7]]
        );

        $creator = $this->userWithRole('Staff');
        $expired = $this->createDraft($creator, 'Expired by last save', now()->subDays(8));
        $legacyExpired = $this->createDraft($creator, 'Expired by update time', null, true);
        $legacyExpired->forceFill(['updated_at' => now()->subDays(8)])->saveQuietly();
        $retained = $this->createDraft($creator, 'Still within retention', now()->subDays(6));

        $this->actingAs($creator, 'sanctum')
            ->getJson('/api/v1/drafts')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $retained->id);

        $this->assertDatabaseMissing('transaction_drafts', ['id' => $expired->id]);
        $this->assertDatabaseMissing('transaction_drafts', ['id' => $legacyExpired->id]);
        $this->assertDatabaseHas('transaction_drafts', ['id' => $retained->id]);
    }

    public function test_official_transaction_creation_consumes_only_the_creator_owned_draft(): void
    {
        $creator = $this->userWithRole('Staff');
        $draft = $this->createDraft($creator, 'Transaction requester');
        $otherDraft = $this->createDraft($creator, 'Another unfinished requester');

        $this->actingAs($creator, 'sanctum')
            ->postJson('/api/v1/transactions', $this->transactionPayload($draft->id))
            ->assertCreated();

        $this->assertDatabaseMissing('transaction_drafts', ['id' => $draft->id]);
        $this->assertDatabaseHas('transaction_drafts', ['id' => $otherDraft->id]);
        $this->assertDatabaseCount('aics_transactions', 1);
    }

    public function test_official_transaction_creation_rejects_a_foreign_draft_id_without_creating_records(): void
    {
        $owner = $this->userWithRole('Staff');
        $otherUser = $this->userWithRole('Senior staff');
        $draft = $this->createDraft($owner, 'Foreign requester');

        $this->actingAs($otherUser, 'sanctum')
            ->postJson('/api/v1/transactions', $this->transactionPayload($draft->id))
            ->assertNotFound();

        $this->assertDatabaseHas('transaction_drafts', ['id' => $draft->id]);
        $this->assertDatabaseCount('aics_transactions', 0);
        $this->assertDatabaseCount('clients', 0);
        $this->assertDatabaseCount('beneficiaries', 0);
    }

    public function test_administrator_retention_setting_is_persisted_and_enforced_by_draft_pruning(): void
    {
        Carbon::setTestNow('2026-11-25 12:00:00');
        $administrator = $this->userWithRole('Administrator');
        $expiredUnderNewPolicy = $this->createDraft($administrator, 'Expired under new policy', now()->subDays(4));
        $retainedUnderNewPolicy = $this->createDraft($administrator, 'Retained under new policy', now()->subDays(2));

        $this->actingAs($administrator, 'sanctum')
            ->putJson('/api/v1/admin/settings', ['keepDraftsDays' => 3])
            ->assertOk()
            ->assertJsonPath('data.keepDraftsDays', 3);

        $this->actingAs($administrator, 'sanctum')
            ->getJson('/api/v1/drafts')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $retainedUnderNewPolicy->id);

        $this->assertDatabaseMissing('transaction_drafts', ['id' => $expiredUnderNewPolicy->id]);
        $this->assertDatabaseHas('transaction_drafts', ['id' => $retainedUnderNewPolicy->id]);
        $this->assertDatabaseHas('system_settings', ['key' => 'keepDraftsDays']);
    }

    public function test_missing_retention_setting_uses_the_30_day_default(): void
    {
        Carbon::setTestNow('2026-11-25 12:00:00');
        SystemSetting::query()->where('key', 'keepDraftsDays')->delete();

        $creator = $this->userWithRole('Staff');
        $expired = $this->createDraft($creator, 'Older than default retention', now()->subDays(31));
        $retained = $this->createDraft($creator, 'Within default retention', now()->subDays(29));

        $this->actingAs($creator, 'sanctum')
            ->getJson('/api/v1/drafts')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $retained->id);

        $this->assertDatabaseMissing('transaction_drafts', ['id' => $expired->id]);
        $this->assertDatabaseHas('transaction_drafts', ['id' => $retained->id]);
    }

    private function userWithRole(string $role): User
    {
        return User::factory()->withRole($role)->create();
    }

    private function createDraft(User $owner, string $clientName, ?Carbon $lastSavedAt = null, bool $nullLastSavedAt = false): TransactionDraft
    {
        return $owner->transactionDrafts()->create([
            'client_name' => $clientName,
            'beneficiary_name' => 'Draft Beneficiary',
            'assistance' => 'Medical',
            'form_data' => $this->formSnapshot($clientName),
            'last_saved_at' => $nullLastSavedAt ? null : ($lastSavedAt ?? now()),
        ]);
    }

    private function formSnapshot(string $clientName): array
    {
        return [
            'schema_version' => 1,
            'transaction' => [
                'transaction_date' => '2026-11-25',
                'client' => ['full_name' => $clientName],
                'beneficiary' => ['full_name' => 'Draft Beneficiary'],
                'family_members' => [],
            ],
            'fields' => [
                'cBarangay' => ['value' => 'North Poblacion', 'checked' => false],
            ],
            'groups' => ['finAssistance' => 'Medical'],
            'step1' => [
                'client_name' => $clientName,
                'beneficiary_name' => 'Draft Beneficiary',
                'assistance_type' => 'Medical',
            ],
        ];
    }

    private function transactionPayload(int $draftId): array
    {
        return [
            'draft_id' => $draftId,
            'transaction_date' => '2026-11-25',
            'client_type' => 'New',
            'source' => 'Walk-in',
            'target_sector' => 'FHONA',
            'amount' => 1200,
            'purpose' => 'Synthetic transaction draft test',
            'client' => [
                'last_name' => 'Draft',
                'first_name' => 'Requester',
                'full_name' => 'Requester Draft',
                'birthdate' => '1988-07-14',
            ],
            'beneficiary' => [
                'last_name' => 'Draft',
                'first_name' => 'Beneficiary',
                'full_name' => 'Beneficiary Draft',
                'birthdate' => '1990-02-10',
            ],
        ];
    }
}
