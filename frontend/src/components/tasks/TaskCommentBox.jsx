import { useState } from 'react'
import { addComment } from '../../api/taskApi'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import toast from 'react-hot-toast'

const TaskCommentBox = ({ taskId, onSuccess }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [comment, setComment] = useState('')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!comment.trim() && !file) {
      setError('Please enter a comment or upload a photo.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const formData = new FormData()
      if (comment.trim()) formData.append('comment', comment)
      if (file) formData.append('photo_proof', file)
      await addComment(taskId, formData)
      toast.success('Comment added!')
      setComment('')
      setFile(null)
      setIsOpen(false)
      if (onSuccess) onSuccess()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add comment.')
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e) => {
    const f = e.target.files[0]
    if (f && f.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB.')
      return
    }
    setFile(f)
    setError('')
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        Add Comment
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Add Comment / Photo Proof">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="Enter your comment here..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Photo Proof <span className="text-gray-400">(JPG, PNG, max 5MB)</span>
            </label>
            <input
              type="file"
              accept=".jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {file && (
              <p className="mt-1 text-xs text-gray-500">Selected: {file.name}</p>
            )}
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" type="button" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}

export default TaskCommentBox
