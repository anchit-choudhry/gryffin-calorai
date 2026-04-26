import * as FakeIndexedDB from "fake-indexeddb";

// Patch global IndexedDB with fake implementation for tests
Object.assign(global, {
  indexedDB: FakeIndexedDB.indexedDB,
  IDBDatabase: FakeIndexedDB.IDBDatabase,
  IDBFactory: FakeIndexedDB.IDBFactory,
  IDBObjectStore: FakeIndexedDB.IDBObjectStore,
  IDBIndex: FakeIndexedDB.IDBIndex,
  IDBKeyRange: FakeIndexedDB.IDBKeyRange,
  IDBCursor: FakeIndexedDB.IDBCursor,
  IDBTransaction: FakeIndexedDB.IDBTransaction,
  IDBRequest: FakeIndexedDB.IDBRequest,
  IDBOpenDBRequest: FakeIndexedDB.IDBOpenDBRequest,
});
