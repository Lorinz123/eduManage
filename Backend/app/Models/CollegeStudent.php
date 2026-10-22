<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CollegeStudent extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_number',
        'first_name',
        'last_name',
        'email',
        'program',
        'department',
        'year_level',
        'section',
        'enrollment_status',
    ];

    protected function casts(): array
    {
        return [
            'year_level' => 'integer',
        ];
    }
}
