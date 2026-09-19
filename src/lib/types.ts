export interface ContainerDTO {
  id: string;
  owner_id: number;
  parent_container_id: string | null;
  name: string;
  photo_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContainerWithMetaDTO extends ContainerDTO {
  item_count: number;
  is_owner: number;
  owner_username: string;
}

export interface ItemDTO {
  id: number;
  container_id: string;
  name: string;
  description: string | null;
  quantity: number | null;
  photo_path: string | null;
  created_at: string;
  updated_at: string;
}
