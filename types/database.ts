export type Database = {
  public: {
    Tables: {
      sources: {
        Row: Source;
        Insert: Omit<Source, "id" | "created_at">;
        Update: Partial<Omit<Source, "id" | "created_at">>;
      };
      tours: {
        Row: Tour;
        Insert: Omit<Tour, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Tour, "id" | "created_at">>;
      };
    };
  };
};

export type Source = {
  id: number;
  name: string;
  url: string;
  created_at: string;
};

export type Tour = {
  id: number;
  source_id: number;
  title: string;
  destination: string | null;
  original_price: number | null;
  discounted_price: number | null;
  discount_percent: number | null;
  departure_date: string | null;
  seats_left: number | null;
  image_url: string | null;
  tour_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
