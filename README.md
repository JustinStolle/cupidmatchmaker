# CupidMatchmaker

An interactive character chat experience inspired by the cult film **Julie & Jack**.
Users can converse with fictional characters through a nostalgic early-2000s style online dating portal.

The application combines modern AI with a retro concept: real-time conversations with story-driven characters.

---

## Features

- Character-based chat conversations
- Distinct personalities and dialogue styles
- AI-generated responses powered by Amazon Bedrock
- Next.js modern web architecture
- Early-2000s inspired online dating portal concept
- Server-side API integration with AWS

Characters currently available:

- **Julie Romanov**
- **Jack Livingstone**

---

## Tech Stack

### Frontend
- Next.js (App Router)
- React
- TypeScript

### Backend
- Next.js API routes
- Amazon Bedrock
- Anthropic Claude Sonnet

### Infrastructure
- AWS
- GitHub

Future planned additions:

- Conversation memory
- Multiple characters
- Persistent chat sessions
- Character profile pages
- Improved retro UI styling

---

## Project Structure

```
src
 ├─ app
 │   ├─ api
 │   │   └─ chat
 │   │       └─ route.ts
 │   └─ page.tsx
 │
 ├─ characters
 │   ├─ julie.ts
 │   └─ jack.ts
 │
 ├─ components
 │   └─ InteractiveChatWindow.tsx
 │
 └─ lib
     ├─ bedrock.ts
     └─ getCharacter.ts
```

---

## Local Development

### 1. Clone the repository

```bash
git clone https://github.com/JustinStolle/cupidmatchmaker.git
cd cupidmatchmaker
```

---

### 2. Install dependencies

```bash
npm install
```

---

### 3. Configure environment variables

Create a file named:

```
.env.local
```

Add:

```
BEDROCK_REGION=us-west-1
BEDROCK_MODEL_ID=us.anthropic.claude-sonnet-4-5-20250929-v1:0
```

---

### 4. Configure AWS credentials

Install the AWS CLI and run:

```bash
aws configure
```

Provide credentials for an IAM user with Bedrock access.

---

### 5. Start the development server

```bash
npm run dev
```

Open:

```
http://localhost:3000
```

---

## How Chat Works

1. User sends a message in the chat UI.
2. The browser sends a request to:

```
/api/chat
```

3. The Next.js API route sends the message to **Amazon Bedrock**.
4. Claude generates a character response.
5. The response is returned to the chat interface.

---

## Future Improvements

Planned enhancements include:

- Multi-message conversation memory
- Character emotional state
- Story branching
- Persistent chat history
- More characters
- Retro interface styling
- Production deployment via AWS

---

## License

This project is licensed under the **MIT License**.

---

## Acknowledgments

Inspired by the independent film **Julie & Jack**, a story about connection, technology, and the human side of online communication.