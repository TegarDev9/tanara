export type Video = {
  id: string;
  title: string;
  url: string;
  duration?: string;
  description?: string;
};

export type Course = {
  id: string;
  slug: string;
  title: string;
  description: string;
  thumbnail?: string;
  videos: Video[];
};

export const courses: Course[] = [
  {
    id: '1',
    slug: 'intro-to-trading',
    title: 'Intro to Trading',
    description: 'Dasar-dasar trading untuk pemula — konsep, strategi, dan psikologi.',
    thumbnail: '/file.svg',
    videos: [
      { id: 'v1', title: 'What is Trading?', url: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: '6:02', description: 'Pendahuluan mengenai trading.' },
      { id: 'v2', title: 'Basic Strategies', url: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: '10:12', description: 'Strategi dasar untuk memulai.' }
    ]
  },
  {
    id: '2',
    slug: 'technical-analysis',
    title: 'Technical Analysis',
    description: 'Belajar membaca chart dan indikator teknikal yang populer.',
    thumbnail: '/globe.svg',
    videos: [
      { id: 'v1', title: 'Candlesticks 101', url: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: '8:20', description: 'Memahami pola candlestick.' },
      { id: 'v2', title: 'Moving Averages', url: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: '12:00', description: 'Penggunaan moving averages.' }
    ]
  }
];
