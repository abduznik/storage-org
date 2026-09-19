import db from "./db";

export interface Container {
  id: string;
  owner_id: number;
  parent_container_id: string | null;
  name: string;
  photo_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface Item {
  id: number;
  container_id: string;
  name: string;
  description: string | null;
  quantity: number | null;
  photo_path: string | null;
  created_at: string;
  updated_at: string;
}

function generateContainerId(): string {
  for (let attempt = 0; attempt < 50; attempt++) {
    const id = String(Math.floor(10000 + Math.random() * 90000));
    const existing = db
      .prepare("SELECT 1 FROM containers WHERE id = ?")
      .get(id);
    if (!existing) return id;
  }
  throw new Error("Failed to generate unique container id");
}

export function createContainer(
  ownerId: number,
  name: string,
  photoPath: string | null,
  parentContainerId: string | null = null
): Container {
  const id = generateContainerId();
  db.prepare(
    "INSERT INTO containers (id, owner_id, name, photo_path, parent_container_id) VALUES (?, ?, ?, ?, ?)"
  ).run(id, ownerId, name, photoPath, parentContainerId);
  return getContainerById(id)!;
}

export function getContainerById(id: string): Container | undefined {
  return db.prepare("SELECT * FROM containers WHERE id = ?").get(id) as
    | Container
    | undefined;
}

export function updateContainer(
  id: string,
  fields: { name?: string; photo_path?: string | null }
) {
  const current = getContainerById(id);
  if (!current) return;
  const name = fields.name ?? current.name;
  const photoPath =
    fields.photo_path !== undefined ? fields.photo_path : current.photo_path;
  db.prepare(
    "UPDATE containers SET name = ?, photo_path = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(name, photoPath, id);
}

export function deleteContainer(id: string) {
  db.prepare("DELETE FROM containers WHERE id = ?").run(id);
}

// Returns true if `candidateAncestorId` is the same as, or an ancestor of,
// `containerId` — used to block moves that would create a cycle.
function isSameOrAncestor(
  containerId: string,
  candidateAncestorId: string
): boolean {
  if (containerId === candidateAncestorId) return true;
  let current = getContainerById(containerId);
  const seen = new Set<string>();
  while (current?.parent_container_id) {
    if (seen.has(current.id)) break;
    seen.add(current.id);
    if (current.parent_container_id === candidateAncestorId) return true;
    current = getContainerById(current.parent_container_id);
  }
  return false;
}

export type MoveResult =
  | { ok: true }
  | { ok: false; error: string };

export function moveContainer(
  containerId: string,
  newParentId: string | null
): MoveResult {
  if (newParentId === containerId) {
    return { ok: false, error: "A container cannot be placed inside itself." };
  }
  if (newParentId) {
    const parent = getContainerById(newParentId);
    if (!parent) return { ok: false, error: "Target container not found." };
    // Prevent moving a container into one of its own descendants.
    if (isSameOrAncestor(newParentId, containerId)) {
      return {
        ok: false,
        error: "Cannot move a container into itself or one of its own contents.",
      };
    }
  }
  db.prepare(
    "UPDATE containers SET parent_container_id = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(newParentId, containerId);
  return { ok: true };
}

export function listChildContainers(
  containerId: string,
  userId: number
): ContainerWithMeta[] {
  return db
    .prepare(
      `SELECT c.*, u.username as owner_username,
              (SELECT COUNT(*) FROM items i WHERE i.container_id = c.id) as item_count,
              CASE WHEN c.owner_id = ? THEN 1 ELSE 0 END as is_owner
       FROM containers c
       JOIN users u ON u.id = c.owner_id
       WHERE c.parent_container_id = ?
       ORDER BY c.name COLLATE NOCASE ASC`
    )
    .all(userId, containerId) as ContainerWithMeta[];
}

// All descendant container ids of `containerId` (not including itself).
function getDescendantIds(containerId: string): Set<string> {
  const result = new Set<string>();
  const stack = [containerId];
  while (stack.length) {
    const current = stack.pop()!;
    const kids = db
      .prepare("SELECT id FROM containers WHERE parent_container_id = ?")
      .all(current) as { id: string }[];
    for (const k of kids) {
      if (!result.has(k.id)) {
        result.add(k.id);
        stack.push(k.id);
      }
    }
  }
  return result;
}

// Containers a user can pick as a new parent/import target: accessible to
// them, matching the query by name or exact id, excluding the container
// itself and any of its own descendants (to prevent cycles) when provided.
export function searchAccessibleContainersForPicker(
  userId: number,
  query: string,
  excludeContainerId?: string
): Container[] {
  const accessible = listAllAccessibleContainers(userId);
  const exclude = new Set<string>();
  if (excludeContainerId) {
    exclude.add(excludeContainerId);
    for (const id of getDescendantIds(excludeContainerId)) exclude.add(id);
  }
  const trimmed = query.trim().toLowerCase();
  return accessible
    .filter((c) => !exclude.has(c.id))
    .filter((c) => {
      if (!trimmed) return true;
      if (c.id === trimmed) return true;
      return c.name.toLowerCase().includes(trimmed);
    })
    .slice(0, 25);
}

export interface BreadcrumbEntry {
  id: string;
  name: string;
}

export function getBreadcrumbPath(containerId: string): BreadcrumbEntry[] {
  const path: BreadcrumbEntry[] = [];
  let current = getContainerById(containerId);
  const seen = new Set<string>();
  while (current) {
    if (seen.has(current.id)) break;
    seen.add(current.id);
    path.unshift({ id: current.id, name: current.name });
    current = current.parent_container_id
      ? getContainerById(current.parent_container_id)
      : undefined;
  }
  return path;
}

// A user can access a container if they own it or it's shared with them.
export function userCanAccessContainer(
  userId: number,
  containerId: string
): boolean {
  const row = db
    .prepare(
      `SELECT 1 FROM containers WHERE id = ? AND owner_id = ?
       UNION
       SELECT 1 FROM container_shares WHERE container_id = ? AND user_id = ?`
    )
    .get(containerId, userId, containerId, userId);
  return !!row;
}

export function userOwnsContainer(userId: number, containerId: string): boolean {
  const row = db
    .prepare("SELECT 1 FROM containers WHERE id = ? AND owner_id = ?")
    .get(containerId, userId);
  return !!row;
}

export interface ContainerWithMeta extends Container {
  item_count: number;
  is_owner: number;
  owner_username: string;
}

// Top-level containers only (no parent) that the user owns or has been
// shared. Nested containers are reached by drilling into their parent.
export function listContainersForUser(userId: number): ContainerWithMeta[] {
  return db
    .prepare(
      `SELECT c.*, u.username as owner_username,
              (SELECT COUNT(*) FROM items i WHERE i.container_id = c.id) as item_count,
              CASE WHEN c.owner_id = ? THEN 1 ELSE 0 END as is_owner
       FROM containers c
       JOIN users u ON u.id = c.owner_id
       WHERE c.parent_container_id IS NULL
         AND (c.owner_id = ?
          OR c.id IN (SELECT container_id FROM container_shares WHERE user_id = ?))
       ORDER BY c.updated_at DESC`
    )
    .all(userId, userId, userId) as ContainerWithMeta[];
}

export function searchContainersAndItems(
  userId: number,
  query: string
): { containers: ContainerWithMeta[]; items: (Item & { container_name: string })[] } {
  const accessible = listAllAccessibleContainers(userId).map((c) => c.id);
  if (accessible.length === 0) return { containers: [], items: [] };

  const trimmed = query.trim();

  // Exact numeric ID match
  if (/^\d+$/.test(trimmed)) {
    const placeholders = accessible.map(() => "?").join(",");
    const containers = db
      .prepare(
        `SELECT c.*, u.username as owner_username,
                (SELECT COUNT(*) FROM items i WHERE i.container_id = c.id) as item_count,
                CASE WHEN c.owner_id = ? THEN 1 ELSE 0 END as is_owner
         FROM containers c
         JOIN users u ON u.id = c.owner_id
         WHERE c.id = ? AND c.id IN (${placeholders})`
      )
      .all(userId, trimmed, ...accessible) as ContainerWithMeta[];
    return { containers, items: [] };
  }

  const like = `%${trimmed}%`;
  const placeholders = accessible.map(() => "?").join(",");

  const containers = db
    .prepare(
      `SELECT c.*, u.username as owner_username,
              (SELECT COUNT(*) FROM items i WHERE i.container_id = c.id) as item_count,
              CASE WHEN c.owner_id = ? THEN 1 ELSE 0 END as is_owner
       FROM containers c
       JOIN users u ON u.id = c.owner_id
       WHERE c.name LIKE ? AND c.id IN (${placeholders})`
    )
    .all(userId, like, ...accessible) as ContainerWithMeta[];

  const items = db
    .prepare(
      `SELECT i.*, c.name as container_name
       FROM items i
       JOIN containers c ON c.id = i.container_id
       WHERE (i.name LIKE ? OR i.description LIKE ?) AND i.container_id IN (${placeholders})
       ORDER BY i.updated_at DESC`
    )
    .all(like, like, ...accessible) as (Item & { container_name: string })[];

  return { containers, items };
}

export function listItemsForContainer(containerId: string): Item[] {
  return db
    .prepare(
      "SELECT * FROM items WHERE container_id = ? ORDER BY name COLLATE NOCASE ASC"
    )
    .all(containerId) as Item[];
}

export function createItem(
  containerId: string,
  name: string,
  description: string | null,
  quantity: number | null
): Item {
  const info = db
    .prepare(
      "INSERT INTO items (container_id, name, description, quantity) VALUES (?, ?, ?, ?)"
    )
    .run(containerId, name, description, quantity);
  return db
    .prepare("SELECT * FROM items WHERE id = ?")
    .get(info.lastInsertRowid) as Item;
}

export function updateItem(
  itemId: number,
  fields: {
    name?: string;
    description?: string | null;
    quantity?: number | null;
    photo_path?: string | null;
  }
) {
  const current = db
    .prepare("SELECT * FROM items WHERE id = ?")
    .get(itemId) as Item | undefined;
  if (!current) return;
  const name = fields.name ?? current.name;
  const description =
    fields.description !== undefined ? fields.description : current.description;
  const quantity =
    fields.quantity !== undefined ? fields.quantity : current.quantity;
  const photoPath =
    fields.photo_path !== undefined ? fields.photo_path : current.photo_path;
  db.prepare(
    "UPDATE items SET name = ?, description = ?, quantity = ?, photo_path = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(name, description, quantity, photoPath, itemId);
}

export function deleteItem(itemId: number) {
  db.prepare("DELETE FROM items WHERE id = ?").run(itemId);
}

export function getItemById(itemId: number): Item | undefined {
  return db.prepare("SELECT * FROM items WHERE id = ?").get(itemId) as
    | Item
    | undefined;
}

// All containers a user can place things into (owned + shared), for move/parent pickers.
export function listAllAccessibleContainers(userId: number): Container[] {
  return db
    .prepare(
      `SELECT c.* FROM containers c
       WHERE c.owner_id = ?
          OR c.id IN (SELECT container_id FROM container_shares WHERE user_id = ?)
       ORDER BY c.name COLLATE NOCASE ASC`
    )
    .all(userId, userId) as Container[];
}

export interface ShareInfo {
  user_id: number;
  username: string;
}

export function listShares(containerId: string): ShareInfo[] {
  return db
    .prepare(
      `SELECT u.id as user_id, u.username
       FROM container_shares cs
       JOIN users u ON u.id = cs.user_id
       WHERE cs.container_id = ?`
    )
    .all(containerId) as ShareInfo[];
}

export function addShare(containerId: string, userId: number) {
  db.prepare(
    "INSERT OR IGNORE INTO container_shares (container_id, user_id) VALUES (?, ?)"
  ).run(containerId, userId);
}

export function removeShare(containerId: string, userId: number) {
  db.prepare(
    "DELETE FROM container_shares WHERE container_id = ? AND user_id = ?"
  ).run(containerId, userId);
}
