export interface MenuItem {
  id: number;
  name: string;
  category: string;
  price: number;
  description?: string;
  status: string;
}

export interface Room {
  id: number;
  room_id: number;
  name: string;
  category: string;
  capacity: number;
  price: number;
  status: string;
  description?: string;
}

export interface Order {
  id: number;
  customer_name: string;
  room: number;
  room_name?: string;
  menu_items: number[] | MenuItem[];
  status: string;
}

export interface Reservation {
  id: number;
  room: number;
  room_name?: string;
  customer_name: string;
  email: string;
  phone: string;
  check_in: string;
  check_out: string;
  guests: number;
  status: string;
}

