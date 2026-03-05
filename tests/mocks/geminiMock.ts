import { http, HttpResponse } from 'msw'

export const geminiMockHandlers = [
  http.post('https://generativelanguage.googleapis.com/:path*', async () => {
    return HttpResponse.json({
      candidates: [
        {
          content: {
            parts: [{ text: 'mocked gemini response' }],
          },
        },
      ],
      text: 'mocked gemini response',
    })
  }),
]
