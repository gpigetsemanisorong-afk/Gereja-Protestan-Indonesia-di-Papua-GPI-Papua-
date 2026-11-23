export interface DailyVerseItem {
  id: string;
  ref: string;
  text: string;
  theme: string;
}

export const DAILY_VERSES: DailyVerseItem[] = [
  {
    id: 'dv-1',
    ref: 'Yohanes 15:5',
    text: 'Akulah pokok anggur dan kamulah ranting-rantingnya. Barangsiapa tinggal di dalam Aku dan Aku di dalam dia, ia berbuah banyak, sebab di luar Aku kamu tidak dapat berbuat apa-apa.',
    theme: 'Tinggal di Dalam Kristus',
  },
  {
    id: 'dv-2',
    ref: 'Mazmur 23:1-2',
    text: 'TUHAN adalah gembalaku, takkan kekurangan aku. Ia membaringkan aku di padang rumput yang hijau, Ia membimbing aku ke air yang tenang.',
    theme: 'Gembala yang Setia',
  },
  {
    id: 'dv-3',
    ref: 'Yeremia 29:11',
    text: 'Sebab Aku ini mengetahui rancangan-rancangan apa yang ada pada-Ku mengenai kamu, demikianlah firman TUHAN, yaitu rancangan damai sejahtera dan bukan rancangan kecelakaan, untuk memberikan kepadamu hari depan yang penuh harapan.',
    theme: 'Harapan Masa Depan',
  },
  {
    id: 'dv-4',
    ref: 'Filipi 4:6-7',
    text: 'Janganlah hendaknya kamu kuatir tentang apa pun juga, tetapi nyatakanlah dalam segala hal keinginanmu kepada Allah dalam doa dan permohonan dengan ucapan syukur. Damai sejahtera Allah, yang melampaui segala akal, akan memelihara hati dan pikiranmu dalam Kristus Yesus.',
    theme: 'Damai Sejahtera Allah',
  },
  {
    id: 'dv-5',
    ref: 'Amsal 3:5-6',
    text: 'Percayalah kepada TUHAN dengan segenap hatimu, dan janganlah bersandar kepada pengertianmu sendiri. Akuilah Dia dalam segala lakumu, maka Ia akan meluruskan jalanmu.',
    theme: 'Percaya Kepada Tuhan',
  },
  {
    id: 'dv-6',
    ref: 'Yesaya 40:31',
    text: 'Tetapi orang-orang yang menanti-nantikan TUHAN mendapat kekuatan baru: mereka seumpama rajawali yang naik terbang dengan kekuatan sayapnya; mereka berlari dan tidak menjadi lesu, mereka berjalan dan tidak menjadi lelah.',
    theme: 'Kekuatan Baru',
  },
  {
    id: 'dv-7',
    ref: 'Yosua 1:9',
    text: 'Bukankah telah Kuperintahkan kepadamu: kuatkan dan teguhkanlah hatimu? Janganlah kecut dan tawar hati, sebab TUHAN, Allahmu, menyertai engkau ke mana pun engkau pergi.',
    theme: 'Penyertaan Tuhan',
  },
  {
    id: 'dv-8',
    ref: 'Roma 8:28',
    text: 'Kita tahu sekarang, bahwa Allah turut bekerja dalam segala sesuatu untuk mendatangkan kebaikan bagi mereka yang mengasihi Dia, yaitu mereka yang terpanggil sesuai dengan rencana Allah.',
    theme: 'Kebaikan Allah',
  },
  {
    id: 'dv-9',
    ref: 'Mazmur 46:2',
    text: 'Allah itu bagi kita tempat perlindungan dan kekuatan, sebagai penolong dalam kesesakan sangat terbukti.',
    theme: 'Tempat Perlindungan',
  },
  {
    id: 'dv-10',
    ref: 'Matius 11:28',
    text: 'Marilah kepada-Ku, semua yang letih lesu dan berbeban berat, Aku akan memberi kelegaan kepadamu.',
    theme: 'Kelegaan dalam Kristus',
  },
  {
    id: 'dv-11',
    ref: '2 Korintus 5:17',
    text: 'Jadi siapa yang ada di dalam Kristus, ia adalah ciptaan baru: yang lama sudah berlalu, sesungguhnya yang baru sudah datang.',
    theme: 'Ciptaan Baru',
  },
  {
    id: 'dv-12',
    ref: '1 Tesalonika 5:16-18',
    text: 'Bersukacitalah senantiasa. Tetaplah berdoa. Mengucap syukurlah dalam segala hal, sebab itulah yang dikehendaki Allah di dalam Kristus Yesus bagi kamu.',
    theme: 'Sukacita & Syukur',
  },
];

export const getTodayDailyVerse = (): DailyVerseItem => {
  const now = new Date();
  // WIT is UTC+9
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const witTime = new Date(utcMs + 9 * 3600000);
  const dayOfYear = Math.floor(
    (witTime.getTime() - new Date(witTime.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  const index = dayOfYear % DAILY_VERSES.length;
  return DAILY_VERSES[index];
};

export const getFormattedWitDate = (): string => {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const witTime = new Date(utcMs + 9 * 3600000);
  return witTime.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};
