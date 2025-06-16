import Pusher from 'pusher';

const pusher = new Pusher({
  appId: process.env.NEXT_PUBLIC_PUSHER_APP_ID,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY,
  secret: process.env.NEXT_PUBLIC_PUSHER_SECRET,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
  useTLS: true
});

export async function POST(req) {
  const { username, pfp, message, roomId } = await req.json();

  const sanitizedRoomId = roomId.replace(/\s+/g, '-'); // Sanitize roomId to prevent issues with spaces

  await pusher.trigger(`chat-${sanitizedRoomId}`, 'new-message', {
    username,
    pfp,
    message
  });

  return NextResponse.json({ success: true });
}
