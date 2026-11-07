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
        Insert: Omit<Tour, "id" | "created_at" | "updated_at" | "notified_at" | "countries">;
        Update: Partial<Omit<Tour, "id" | "created_at">>;
      };
      price_history: {
        Row: PriceHistory;
        Insert: Omit<PriceHistory, "id" | "recorded_at">;
        Update: Partial<Omit<PriceHistory, "id">>;
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
  // Countries the tour visits, set by the scraper. Missing on a database without migration 008.
  countries?: string[];
  notified_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PriceHistory = {
  id: number;
  tour_id: number;
  discounted_price: number | null;
  original_price: number | null;
  recorded_at: string;
};
