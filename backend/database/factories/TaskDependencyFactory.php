<?php

namespace Database\Factories;

use App\Models\TaskDependency;
use App\Models\KanbanTask;
use Illuminate\Database\Eloquent\Factories\Factory;

class TaskDependencyFactory extends Factory
{
    protected $model = TaskDependency::class;

    public function definition()
    {
        return [
            'task_id' => KanbanTask::factory(),
            'depends_on_task_id' => KanbanTask::factory(),
            'type' => $this->faker->randomElement(['blocks', 'relates', 'duplicates']),
        ];
    }
}
