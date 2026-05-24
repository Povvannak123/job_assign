<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'admin@jobassign.com'],
            [
                'name'      => 'Admin User',
                'password'  => Hash::make('password'),
                'role'      => 'admin',
                'is_active' => true,
            ]
        );

        $staffMembers = [
            ['name' => 'Alice Johnson',  'email' => 'staff1@jobassign.com'],
            ['name' => 'Bob Smith',      'email' => 'staff2@jobassign.com'],
            ['name' => 'Carol White',    'email' => 'staff3@jobassign.com'],
            ['name' => 'David Brown',    'email' => 'staff4@jobassign.com'],
            ['name' => 'Eva Martinez',   'email' => 'staff5@jobassign.com'],
        ];

        foreach ($staffMembers as $staff) {
            User::firstOrCreate(
                ['email' => $staff['email']],
                [
                    'name'      => $staff['name'],
                    'password'  => Hash::make('password'),
                    'role'      => 'staff',
                    'is_active' => true,
                ]
            );
        }
    }
}
