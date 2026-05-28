/// VeriGen Registry — On-chain provenance registry for AI-generated images.
/// Stores a mapping of Walrus blob IDs to certification entries.
module verigen_registry::registry {
    use std::string::String;
    use sui::table::{Self, Table};

    /// A single certification entry.
    public struct Entry has store, drop {
        blob_id: String,
        image_hash: String,
        prompt: String,
        timestamp: u64,
        creator: address,
    }

    /// The shared registry object.
    public struct Registry has key {
        id: UID,
        entries: Table<String, Entry>,
        total: u64,
    }

    /// Create the shared registry. Call once at publish time.
    fun init(ctx: &mut TxContext) {
        let registry = Registry {
            id: object::new(ctx),
            entries: table::new(ctx),
            total: 0,
        };
        transfer::share_object(registry);
    }

    /// Register a new certified image.
    public entry fun register(
        registry: &mut Registry,
        blob_id: String,
        image_hash: String,
        prompt: String,
        timestamp: u64,
        ctx: &mut TxContext,
    ) {
        let entry = Entry {
            blob_id: blob_id,
            image_hash,
            prompt,
            timestamp,
            creator: tx_context::sender(ctx),
        };
        table::add(&mut registry.entries, blob_id, entry);
        registry.total = registry.total + 1;
    }

    /// Check if a blob ID is registered.
    public fun is_registered(registry: &Registry, blob_id: &String): bool {
        table::contains(&registry.entries, *blob_id)
    }

    /// Get the total number of registrations.
    public fun total(registry: &Registry): u64 {
        registry.total
    }
}
