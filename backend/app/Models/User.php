<?php

namespace App\Models;

use App\Enums\UserRole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'staff_id',
        'name',
        'email',
        'password',
        'role',
        'position',
        'phone_number',
        'gender',
        'start_date',
        'location_row',
        'day_off',
        'store_name',
        'shift',
        'avatar',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $appends = ['avatar_url'];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'role' => UserRole::class,
        'is_active' => 'boolean',
    ];

    public function getAvatarUrlAttribute(): ?string
    {
        if (!$this->avatar) {
            return null;
        }
        return url('storage/' . $this->avatar);
    }

    public function assignedTasks()
    {
        return $this->hasMany(Task::class, 'assigned_to');
    }

    public function createdTasks()
    {
        return $this->hasMany(Task::class, 'created_by');
    }

    public function taskComments()
    {
        return $this->hasMany(TaskComment::class, 'user_id');
    }

    public function taskTemplateItems()
    {
        return $this->hasMany(TaskTemplateItem::class, 'staff_id');
    }
}
