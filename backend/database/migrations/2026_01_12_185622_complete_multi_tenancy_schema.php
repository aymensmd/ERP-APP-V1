<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // Add company_id to roles table
        // Roles should be company-specific so each company can define their own roles
        if (Schema::hasTable('roles') && !Schema::hasColumn('roles', 'company_id')) {
            // Get first company for data population
            $firstCompany = DB::table('companies')->where('is_active', true)->first();
            
            Schema::table('roles', function (Blueprint $table) use ($firstCompany) {
                // Add company_id with default value to existing records
                if ($firstCompany) {
                    $table->foreignId('company_id')->default($firstCompany->id)->after('id');
                } else {
                    $table->foreignId('company_id')->after('id');
                }
                $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
                $table->index('company_id');
            });

            // Update unique constraint to include company_id
            if (Schema::hasColumn('roles', 'slug')) {
                Schema::table('roles', function (Blueprint $table) {
                    try {
                        $table->dropUnique(['slug']);
                    } catch (\Exception $e) {
                        // Unique constraint may not exist
                    }
                    $table->unique(['company_id', 'slug']);
                });
            }
        }

        // Add company_id to invoice_items (inherits from invoice)
        if (Schema::hasTable('invoice_items') && !Schema::hasColumn('invoice_items', 'company_id')) {
            // First, populate company_id from invoices using raw SQL
            if (DB::table('invoice_items')->count() > 0) {
                DB::statement('
                    ALTER TABLE invoice_items 
                    ADD COLUMN company_id BIGINT UNSIGNED NULL AFTER id
                ');

                DB::statement('
                    UPDATE invoice_items 
                    SET company_id = (
                        SELECT company_id 
                        FROM invoices 
                        WHERE invoices.id = invoice_items.invoice_id
                    )
                ');

                // Now make it NOT NULL and add constraints
                DB::statement('ALTER TABLE invoice_items MODIFY company_id BIGINT UNSIGNED NOT NULL');
                
                Schema::table('invoice_items', function (Blueprint $table) {
                    $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
                    $table->index('company_id');
                });
            } else {
                // No existing records, can add directly
                Schema::table('invoice_items', function (Blueprint $table) {
                    $table->foreignId('company_id')->after('id');
                    $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
                    $table->index('company_id');
                });
            }
        }

        // Add company_id to payments (inherits from invoice)
        if (Schema::hasTable('payments') && !Schema::hasColumn('payments', 'company_id')) {
            if (DB::table('payments')->count() > 0) {
                DB::statement('
                    ALTER TABLE payments 
                    ADD COLUMN company_id BIGINT UNSIGNED NULL AFTER id
                ');

                DB::statement('
                    UPDATE payments 
                    SET company_id = (
                        SELECT company_id 
                        FROM invoices 
                        WHERE invoices.id = payments.invoice_id
                    )
                ');

                DB::statement('ALTER TABLE payments MODIFY company_id BIGINT UNSIGNED NOT NULL');
                
                Schema::table('payments', function (Blueprint $table) {
                    $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
                    $table->index('company_id');
                });
            } else {
                Schema::table('payments', function (Blueprint $table) {
                    $table->foreignId('company_id')->after('id');
                    $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
                    $table->index('company_id');
                });
            }
        }

        // Add company_id to task_dependencies (inherits from task)
        if (Schema::hasTable('task_dependencies') && !Schema::hasColumn('task_dependencies', 'company_id')) {
            if (DB::table('task_dependencies')->count() > 0) {
                DB::statement('
                    ALTER TABLE task_dependencies 
                    ADD COLUMN company_id BIGINT UNSIGNED NULL AFTER id
                ');

                DB::statement('
                    UPDATE task_dependencies 
                    SET company_id = (
                        SELECT company_id 
                        FROM kanban_tasks 
                        WHERE kanban_tasks.id = task_dependencies.task_id
                    )
                ');

                DB::statement('ALTER TABLE task_dependencies MODIFY company_id BIGINT UNSIGNED NOT NULL');
                
                Schema::table('task_dependencies', function (Blueprint $table) {
                    $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
                    $table->index('company_id');
                });
            } else {
                Schema::table('task_dependencies', function (Blueprint $table) {
                    $table->foreignId('company_id')->after('id');
                    $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
                    $table->index('company_id');
                });
            }
        }

        // Ensure shifts have company_id
        if (Schema::hasTable('shifts') && !Schema::hasColumn('shifts', 'company_id')) {
            $firstCompany = DB::table('companies')->where('is_active', true)->first();
            
            Schema::table('shifts', function (Blueprint $table) use ($firstCompany) {
                if ($firstCompany) {
                    $table->foreignId('company_id')->default($firstCompany->id)->after('id');
                } else {
                    $table->foreignId('company_id')->after('id');
                }
                $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
                $table->index('company_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        // Drop company_id from roles
        if (Schema::hasColumn('roles', 'company_id')) {
            Schema::table('roles', function (Blueprint $table) {
                try {
                    $table->dropUnique(['company_id', 'slug']);
                } catch (\Exception $e) {}
                $table->dropForeign(['company_id']);
                $table->dropColumn('company_id');
            });
            
            if (Schema::hasColumn('roles', 'slug')) {
                Schema::table('roles', function (Blueprint $table) {
                    $table->unique('slug');
                });
            }
        }

        // Drop company_id from invoice_items
        if (Schema::hasColumn('invoice_items', 'company_id')) {
            Schema::table('invoice_items', function (Blueprint $table) {
                $table->dropForeign(['company_id']);
                $table->dropColumn('company_id');
            });
        }

        // Drop company_id from payments
        if (Schema::hasColumn('payments', 'company_id')) {
            Schema::table('payments', function (Blueprint $table) {
                $table->dropForeign(['company_id']);
                $table->dropColumn('company_id');
            });
        }

        // Drop company_id from task_dependencies
        if (Schema::hasColumn('task_dependencies', 'company_id')) {
            Schema::table('task_dependencies', function (Blueprint $table) {
                $table->dropForeign(['company_id']);
                $table->dropColumn('company_id');
            });
        }

        // Drop from shifts
        if (Schema::hasColumn('shifts', 'company_id')) {
            Schema::table('shifts', function (Blueprint $table) {
                $table->dropForeign(['company_id']);
                $table->dropColumn('company_id');
            });
        }
    }
};
