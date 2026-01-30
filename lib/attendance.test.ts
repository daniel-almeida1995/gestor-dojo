import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockSupabaseQuery, mockMethods } = vi.hoisted(() => {
    const mockSelect = vi.fn();
    const mockInsert = vi.fn();
    const mockDelete = vi.fn();
    const mockEq = vi.fn();
    const mockIn = vi.fn();

    const mockSupabaseQuery = {
        select: mockSelect,
        insert: mockInsert,
        delete: mockDelete,
        eq: mockEq,
        in: mockIn
    };

    // Setup default returns for chaining
    mockSelect.mockReturnValue(mockSupabaseQuery);
    mockInsert.mockReturnValue(Promise.resolve({ error: null }));
    mockDelete.mockReturnValue(mockSupabaseQuery);
    mockEq.mockReturnValue(mockSupabaseQuery);
    mockIn.mockReturnValue(Promise.resolve({ error: null }));

    return {
        mockSupabaseQuery,
        mockMethods: { mockSelect, mockInsert, mockDelete, mockEq, mockIn }
    };
});

vi.mock('./supabase', () => ({
    supabase: {
        auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } } })
        },
        from: vi.fn().mockReturnValue(mockSupabaseQuery)
    }
}));

import { checkInStudents } from './attendance';

describe('checkInStudents', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset default mock returns using the hoisted methods
        mockMethods.mockSelect.mockReturnValue(mockSupabaseQuery);
        mockMethods.mockInsert.mockResolvedValue({ error: null });
        mockMethods.mockDelete.mockReturnValue(mockSupabaseQuery);
        mockMethods.mockEq.mockReturnValue(mockSupabaseQuery);
        mockMethods.mockIn.mockResolvedValue({ error: null });
    });

    it('should add new students correctly', async () => {
        // Mock existing records: None
        mockMethods.mockEq.mockResolvedValueOnce({ data: [], error: null });

        const result = await checkInStudents('class-1', ['student-A', 'student-B']);

        expect(result.success).toBe(true);
        expect(mockMethods.mockInsert).toHaveBeenCalledWith(expect.arrayContaining([
            expect.objectContaining({ student_id: 'student-A' }),
            expect.objectContaining({ student_id: 'student-B' })
        ]));
        expect(mockMethods.mockDelete).not.toHaveBeenCalled();
    });

    it('should remove unchecked students correctly', async () => {
        // Mock existing: Student A
        mockMethods.mockEq.mockResolvedValueOnce({
            data: [{ student_id: 'student-A' }],
            error: null
        });

        // Submit empty list
        const result = await checkInStudents('class-1', []);

        expect(result.success).toBe(true);
        expect(mockMethods.mockInsert).not.toHaveBeenCalled();
        expect(mockMethods.mockDelete).toHaveBeenCalled();
        expect(mockMethods.mockIn).toHaveBeenCalledWith('student_id', ['student-A']);
    });

    it('should perform a sync: add new AND remove old', async () => {
        // Mock existing: A and B
        mockMethods.mockEq.mockResolvedValueOnce({
            data: [
                { student_id: 'student-A' },
                { student_id: 'student-B' }
            ],
            error: null
        });

        // Submit: B and C. (A removed, C added)
        const result = await checkInStudents('class-1', ['student-B', 'student-C']);

        expect(result.success).toBe(true);

        // Should insert C
        expect(mockMethods.mockInsert).toHaveBeenCalledWith(expect.arrayContaining([
            expect.objectContaining({ student_id: 'student-C' })
        ]));

        // Should NOT insert B
        const insertCall = mockMethods.mockInsert.mock.calls[0] || [[]];
        // @ts-ignore
        const insertedIds = insertCall[0].map(r => r.student_id);
        expect(insertedIds).not.toContain('student-B');

        // Should delete A
        expect(mockMethods.mockDelete).toHaveBeenCalled();
        expect(mockMethods.mockIn).toHaveBeenCalledWith('student_id', ['student-A']);
    });
});
