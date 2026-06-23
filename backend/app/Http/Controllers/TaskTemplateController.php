<?php

namespace App\Http\Controllers;

use App\Models\TaskTemplateItem;
use App\Models\User;
use Illuminate\Http\Request;

class TaskTemplateController extends Controller
{
    /** GET /task-templates — list all staff with their template item counts */
    public function index()
    {
        $staff = User::where('role', 'staff')
            ->withCount('taskTemplateItems')
            ->orderBy('name')
            ->get(['id', 'name', 'position', 'role']);

        return response()->json(['success' => true, 'data' => $staff]);
    }

    /** GET /task-templates/{staffId} — get all template items for one staff member */
    public function show($staffId)
    {
        $items = TaskTemplateItem::where('staff_id', $staffId)
            ->orderBy('category')
            ->orderBy('sort_order')
            ->get();

        return response()->json(['success' => true, 'data' => $items]);
    }

    /** POST /task-templates/{staffId}/items — add a template item */
    public function store(Request $request, $staffId)
    {
        $request->validate([
            'title'    => 'required|string|max:500',
            'category' => 'required|in:daily,weekly,monthly,quarterly',
        ]);

        // Place at the end of its category
        $maxOrder = TaskTemplateItem::where('staff_id', $staffId)
            ->where('category', $request->category)
            ->max('sort_order') ?? -1;

        $item = TaskTemplateItem::create([
            'staff_id'   => $staffId,
            'title'      => trim($request->title),
            'category'   => $request->category,
            'sort_order' => $maxOrder + 1,
        ]);

        return response()->json(['success' => true, 'data' => $item], 201);
    }

    /** PUT /task-templates/items/{id} — update title and/or category */
    public function update(Request $request, $id)
    {
        $item = TaskTemplateItem::findOrFail($id);

        $request->validate([
            'title'      => 'sometimes|string|max:500',
            'category'   => 'sometimes|in:daily,weekly,monthly,quarterly',
            'sort_order' => 'sometimes|integer|min:0',
        ]);

        $item->update($request->only('title', 'category', 'sort_order'));

        return response()->json(['success' => true, 'data' => $item]);
    }

    /** DELETE /task-templates/items/{id} */
    public function destroy($id)
    {
        TaskTemplateItem::findOrFail($id)->delete();
        return response()->json(['success' => true]);
    }

    /** POST /task-templates/{staffId}/reorder — reorder all items in one category */
    public function reorder(Request $request, $staffId)
    {
        $request->validate([
            'category' => 'required|in:daily,weekly,monthly,quarterly',
            'ids'      => 'required|array',
            'ids.*'    => 'integer',
        ]);

        foreach ($request->ids as $order => $id) {
            TaskTemplateItem::where('id', $id)
                ->where('staff_id', $staffId)
                ->update(['sort_order' => $order]);
        }

        return response()->json(['success' => true]);
    }
}
