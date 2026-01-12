<?php

namespace Database\Factories;

use App\Models\KanbanTask;
use App\Models\Company;
use App\Models\KanbanBoard;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class KanbanTaskFactory extends Factory
{
    protected $model = KanbanTask::class;

    public function definition()
    {
        return [
            'company_id' => Company::factory(),
            'board_id' => KanbanBoard::factory(),
            'title' => $this->faker->sentence(3),
            'description' => $this->faker->paragraph(),
            'status' => $this->faker->randomElement(['todo', 'in_progress', 'done']),
            'position' => $this->faker->numberBetween(1, 10),
            'priority' => $this->faker->randomElement(['low', 'medium', 'high']),
            'due_date' => $this->faker->date(),
            'assigned_to' => User::factory(),
            'created_by' => User::factory(),
            'tags' => [],
            'estimated_hours' => $this->faker->numberBetween(1, 40),
            'actual_hours' => $this->faker->numberBetween(1, 40),
        ];
    }
}
