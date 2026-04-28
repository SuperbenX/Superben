
import { AudioItem, AudioType, AudioStatus, Soundscape } from './types';

// Added SOUNDSCAPES for SoundPanel component
export const SOUNDSCAPES: Soundscape[] = [
  { id: 'rain', name: 'Rain', icon: '🌧️', description: 'Soft pitter-patter on a tin roof.' },
  { id: 'forest', name: 'Forest', icon: '🌲', description: 'Rustling leaves and distant birds.' },
  { id: 'ocean', name: 'Ocean', icon: '🌊', description: 'Gentle waves on a sandy shore.' },
  { id: 'fire', name: 'Fireplace', icon: '🔥', description: 'Crackling wood and warm embers.' },
];

const generateCinematicEmbers = (): AudioItem[] => {
  const movies = [
    { name: "肖申克的救赎", intro: "瑞德，那个关于希望的午后，阳光洒在房顶，这不仅是自由的味道，更是入睡前的宁静。" },
    { name: "教父", intro: "那些关于家族的低语，在阴影中盘旋。让权力和纷争在这一刻熄灭，只剩下壁炉的余烬。" },
    { name: "星际穿越", intro: "跨越亿万光年的孤独，最终落在那排书架后。在库珀的视线里，我们缓缓闭眼。" }
  ];
  return movies.map((movie, index) => ({
    id: `ember-${index + 1}`,
    title: `《${movie.name}》- 场景素描`,
    type: AudioType.SLEEP,
    category: '光影的余烬',
    url: `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${(index % 10) + 1}.mp3`,
    coverImage: `https://images.unsplash.com/photo-${1485846234645 + index}-aae511591952?auto=format&fit=crop&q=80&w=600`, 
    duration: '45:00',
    description: `[光影素描] 极慢速度描述《${movie.name}》中一个寂静的长镜头。`,
    introText: movie.intro,
    tags: ["低剧情起伏", "氛围电影"],
    status: AudioStatus.PUBLISHED,
    updateDate: '2024-05-31',
    isAiGenerated: true
  }));
};

const generateClassicMasterpieces = (): AudioItem[] => {
  const classics = [
    { name: "瓦尔登湖", intro: "湖边的清晨，鸟鸣很轻。梭罗在木屋前坐下，纸页翻动的声音，是森林的呼吸。" },
    { name: "追忆似水年华", intro: "那块浸在红茶里的玛德莱娜小点心，散发出时间的陈香。让记忆慢慢融化，直到梦境开启。" }
  ];
  return classics.map((book, index) => ({
    id: `classic-${index + 1}`,
    title: `《${book.name}》- 逐页素描`,
    type: AudioType.SLEEP,
    category: '故纸堆里的哈欠',
    url: `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${(index % 10) + 5}.mp3`,
    coverImage: `https://images.unsplash.com/photo-${1512820790803 + index}-d47c4b391b4c?auto=format&fit=crop&q=80&w=600`,
    duration: '60:00',
    description: `平铺直叙地描述《${book.name}》的排版与纸张克重。`,
    introText: book.intro,
    tags: ["深度催眠", "极慢速"],
    status: AudioStatus.PUBLISHED,
    updateDate: '2024-05-30',
    isAiGenerated: false
  }));
};

const generateAmberAdagio = (): AudioItem[] => {
  const adagios = [
    { title: "巴赫：G弦上的咏叹调", desc: "缓慢舒展的弦乐，如静谧河流。" },
    { title: "德彪西：月光", desc: "柔和的钢琴波纹，映照意识的湖面。" }
  ];
  return adagios.map((music, index) => ({
    id: `adagio-${index + 1}`,
    title: music.title,
    type: AudioType.SLEEP,
    category: '琥珀色的慢板',
    url: `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${(index % 10) + 3}.mp3`,
    coverImage: `https://images.unsplash.com/photo-${1514119412350 + index}-e174d90d280e?auto=format&fit=crop&q=80&w=600`,
    duration: '30:00',
    description: `[琥珀色慢板] ${music.desc}`,
    tags: ["纯音乐", "低频无损"],
    status: AudioStatus.PUBLISHED,
    updateDate: '2024-06-01'
  }));
};

// Added MOCK_STORIES for StoryPanel component
export const MOCK_STORIES = [
  {
    id: 's1',
    title: 'The Starry Night',
    imageUrl: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?auto=format&fit=crop&q=80&w=600',
    duration: '20m',
    description: 'A journey through a swirling sky.'
  },
  {
    id: 's2',
    title: 'Autumn Leaves',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=600',
    duration: '15m',
    description: 'The golden hour in a silent wood.'
  }
];

export const MOCK_AUDIO_ITEMS: AudioItem[] = [
  ...generateClassicMasterpieces(),
  ...generateCinematicEmbers(),
  ...generateAmberAdagio(),
  {
    id: 'w1',
    title: '深夜火车站远处轰鸣',
    type: AudioType.NIGHT_WAKE,
    category: '无剧情放映室',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    coverImage: 'https://images.unsplash.com/photo-1542332213-31f87348057f?auto=format&fit=crop&q=80&w=600',
    duration: '10:00',
    description: '极低频，适合夜醒后快速拉回睡眠状态。',
    tags: ["非人声", "白噪声"],
    status: AudioStatus.PUBLISHED,
    updateDate: '2024-05-21'
  }
];

export const STORAGE_KEYS = {
  LOGS: 'zenrest_v2_play_logs',
  SETTINGS: 'zenrest_v2_settings',
  ITEMS: 'zenrest_v2_audio_items'
};
