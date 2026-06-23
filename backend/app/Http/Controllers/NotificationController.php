<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /** Staff: list unread + recent notifications */
    public function index(Request $request)
    {
        $notifications = $request->user()
            ->notifications()
            ->latest()
            ->limit(50)
            ->get()
            ->map(fn($n) => [
                'id'         => $n->id,
                'data'       => $n->data,
                'read_at'    => $n->read_at,
                'created_at' => $n->created_at,
            ]);

        return response()->json([
            'success' => true,
            'data'    => $notifications,
            'unread'  => $request->user()->unreadNotifications()->count(),
        ]);
    }

    /** Staff: mark one as read */
    public function markRead(Request $request, $id)
    {
        $n = $request->user()->notifications()->findOrFail($id);
        $n->markAsRead();
        return response()->json(['success' => true]);
    }

    /** Staff: mark all as read */
    public function markAllRead(Request $request)
    {
        $request->user()->unreadNotifications->markAsRead();
        return response()->json(['success' => true]);
    }
}
