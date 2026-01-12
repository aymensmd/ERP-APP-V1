<?php

namespace Database\Factories;

use App\Models\KanbanBoard;
use App\Models\Company;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class KanbanBoardFactory extends Factory
{
    protected $model = KanbanBoard::class;

    public function definition()
    {
        return [
            'company_id' => Company::factory(),
            'name' => $this->faker->word() . ' Board',
            'description' => $this->faker->sentence(),
            'project_id' => null,
            'created_by' => User::factory(),
            'settings' => [],
            'is_archived' => $this->faker->boolean(10),
        ];
    }
}
