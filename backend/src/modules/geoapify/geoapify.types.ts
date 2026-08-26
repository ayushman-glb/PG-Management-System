export interface NormalizedLocation {
  id: string;
  formattedAddress: string;
  name: string;
  city?: string | null;
  locality?: string | null;
  suburb?: string | null;
  district?: string | null;
  state?: string | null;
  country?: string | null;
  postcode?: string | null;
  latitude: number;
  longitude: number;
  resultType?: string | null;
}

export interface GeoapifyFeature {
  type: string;
  properties: {
    place_id?: string;
    osm_id?: string | number;
    formatted?: string;
    name?: string;
    city?: string;
    suburb?: string;
    district?: string;
    county?: string;
    state?: string;
    country?: string;
    postcode?: string;
    lat?: number;
    lon?: number;
    result_type?: string;
    category?: string;
    address_line1?: string;
    address_line2?: string;
    [key: string]: any;
  };
  geometry: {
    type: string;
    coordinates: [number, number]; // [lon, lat]
  };
}

export interface GeoapifyRawResponse {
  type?: string;
  features?: GeoapifyFeature[];
  results?: Array<{
    place_id?: string;
    formatted?: string;
    name?: string;
    city?: string;
    suburb?: string;
    district?: string;
    state?: string;
    country?: string;
    postcode?: string;
    lat?: number;
    lon?: number;
    result_type?: string;
    [key: string]: any;
  }>;
  query?: {
    text?: string;
    parsed?: Record<string, any>;
  };
}
