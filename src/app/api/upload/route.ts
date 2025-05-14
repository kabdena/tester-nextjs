// app/api/hello/route.js

export async function GET() {
  return Response.json({ message: 'Привет из API!' });
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'development') {
    return new Response('Успешно обработан', { status: 200 });
  }

  const formData = await request.formData();
  const file = formData.get('file');

  if (!file || !(file instanceof File)) {
    return new Response('Ошибка обработки', { status: 200 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  const tgFormData = new FormData();
  tgFormData.append('chat_id', chatId);
  tgFormData.append(
    'document',
    new Blob([buffer], { type: file.type }),
    file.name,
  );

  const tgResponse = await fetch(
    `https://api.telegram.org/bot${botToken}/sendDocument`,
    {
      method: 'POST',
      body: tgFormData,
    },
  );

  if (!tgResponse.ok) {
    return new Response('Ошибка обработки', { status: 200 });
  }

  return new Response('Успешно обработан', { status: 200 });
}
