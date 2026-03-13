/**
 * Extended voice metadata for Voice Library display
 * This data is used for UI display purposes (avatar, description, tags, etc.)
 */

export interface VoiceMetadata {
  id: string;
  name: string;
  region: "Miền Bắc" | "Miền Trung" | "Miền Nam";
  gender: "Nam" | "Nữ";
  style: string;
  description: string;
  avatarColor: string;
}

/**
 * Extended voice data for Voice Library
 * Maps to customModels in config.ts by ID
 */
export const voiceMetadata: VoiceMetadata[] = [
  { 
    id: "ngochuyen", 
    name: "Ngọc Huyền", 
    region: "Miền Bắc", 
    gender: "Nữ", 
    style: "Truyền cảm", 
    description: "Giọng đọc nhẹ nhàng, phù hợp cho podcast và kể chuyện tình cảm.",
    avatarColor: "#ec4899"
  },
  { 
    id: "banmai", 
    name: "Ban Mai", 
    region: "Miền Bắc", 
    gender: "Nữ", 
    style: "Tin tức", 
    description: "Tròn vành rõ chữ, giọng đọc chuẩn bản tin thời sự.",
    avatarColor: "#ec4899"
  },
  { 
    id: "manhdung", 
    name: "Mạnh Dũng", 
    region: "Miền Nam", 
    gender: "Nam", 
    style: "Doanh nghiệp", 
    description: "Trầm ấm, uy tín, lý tưởng cho đọc bản tin tài chính.",
    avatarColor: "#3b82f6"
  },
  { 
    id: "minhquang", 
    name: "Minh Quang", 
    region: "Miền Trung", 
    gender: "Nam", 
    style: "Truyền cảm", 
    description: "Giọng đọc truyền cảm, mang âm hưởng miền Trung đặc trưng.",
    avatarColor: "#3b82f6"
  },
  { 
    id: "duyoryx3175", 
    name: "Duy Oryx", 
    region: "Miền Nam", 
    gender: "Nam", 
    style: "Công nghệ", 
    description: "Năng động và trẻ trung, phù hợp cho video review công nghệ.",
    avatarColor: "#3b82f6"
  },
  { 
    id: "maiphuong", 
    name: "Mai Phương", 
    region: "Miền Bắc", 
    gender: "Nữ", 
    style: "Quảng cáo", 
    description: "Tốc độ đọc nhanh, truyền cảm hứng, lý tưởng cho quảng cáo.",
    avatarColor: "#ec4899"
  },
  { 
    id: "lacphi", 
    name: "Lạc Phi", 
    region: "Miền Trung", 
    gender: "Nữ", 
    style: "Du lịch", 
    description: "Ngọt ngào và trong trẻo, lý tưởng cho đọc thơ và giới thiệu du lịch.",
    avatarColor: "#ec4899"
  },
  { 
    id: "minhkhang", 
    name: "Minh Khang", 
    region: "Miền Bắc", 
    gender: "Nam", 
    style: "Giáo dục", 
    description: "Giọng đọc trầm và vang, phù hợp với video giáo dục.",
    avatarColor: "#3b82f6"
  },
  { 
    id: "chieuthanh", 
    name: "Chiếu Thành", 
    region: "Miền Nam", 
    gender: "Nam", 
    style: "Truyền thống", 
    description: "Giọng ông lão miền Tây chân chất, kể chuyện đồng quê.",
    avatarColor: "#3b82f6"
  },
  { 
    id: "mytam2794", 
    name: "Mỹ Tâm", 
    region: "Miền Nam", 
    gender: "Nữ", 
    style: "Ca hát", 
    description: "Giọng hát trong sáng, phù hợp cho nhạc và giải trí.",
    avatarColor: "#ec4899"
  },
  { 
    id: "anhkhoi", 
    name: "Anh Khôi", 
    region: "Miền Bắc", 
    gender: "Nam", 
    style: "Hiện đại", 
    description: "Trẻ trung và năng động, phù hợp cho nội dung mạng xã hội.",
    avatarColor: "#3b82f6"
  },
];

/**
 * Get voice metadata by ID
 */
export function getVoiceMetadata(id: string): VoiceMetadata | undefined {
  return voiceMetadata.find(v => v.id === id);
}
