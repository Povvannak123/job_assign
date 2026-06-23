<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TaskTemplateItem extends Model
{
    protected $fillable = ['staff_id', 'title', 'category', 'sort_order'];

    public function staff()
    {
        return $this->belongsTo(User::class, 'staff_id');
    }
}
