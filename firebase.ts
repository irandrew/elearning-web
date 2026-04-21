@import "tailwindcss";

@layer base {
  body {
    @apply antialiased;
  }
}

@layer utilities {
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    @apply bg-transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    @apply bg-gray-200 rounded-full hover:bg-gray-300 transition-colors;
  }

  .markdown-body {
    @apply leading-relaxed text-gray-700;
  }
  .markdown-body h1 { @apply text-4xl font-black mb-8 mt-12 text-gray-900; }
  .markdown-body h2 { @apply text-2xl font-extrabold mb-4 mt-10 text-gray-800 border-b pb-2; }
  .markdown-body h3 { @apply text-xl font-bold mb-3 mt-8 text-gray-800; }
  .markdown-body p { @apply mb-6; }
  .markdown-body ul { @apply list-disc list-inside mb-6 space-y-2; }
  .markdown-body ol { @apply list-decimal list-inside mb-6 space-y-2; }
  .markdown-body blockquote { @apply border-l-4 border-blue-200 pl-6 italic my-8 text-gray-500; }
  .markdown-body code { @apply bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-[#004A99]; }
  .markdown-body pre { @apply bg-gray-900 text-white p-6 rounded-2xl my-8 overflow-x-auto font-mono text-sm shadow-lg; }
}

