import service from './ActivityApiService';
import apiConfig from './apiConfig';
jest.mock('./apiConfig', () => ({ post: jest.fn() }));
it('conserva attemptId y las respuestas al serializar la finalización', async () => {
    const responseLogs = [{ questionId: 5, responseAnswerId: 6, isCorrect: true }];
    apiConfig.post.mockResolvedValue({ attemptId: 20 });
    await service.completeActivity({ activityId: 18, attemptId: 20, correctAnswers: 1, responseLogs });
    expect(apiConfig.post).toHaveBeenCalledWith('/api/activities/complete', expect.objectContaining({ activityId: 18, attemptId: 20, responseLogs }));
});
