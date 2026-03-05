import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'posts.index': { paramsTuple?: []; params?: {} }
    'posts.show': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'posts.store': { paramsTuple?: []; params?: {} }
    'posts.update': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'posts.destroy': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'auth.register': { paramsTuple?: []; params?: {} }
    'auth.login': { paramsTuple?: []; params?: {} }
    'auth.logout': { paramsTuple?: []; params?: {} }
    'auth.me': { paramsTuple?: []; params?: {} }
    'stats.index': { paramsTuple?: []; params?: {} }
    'stats.tables': { paramsTuple?: []; params?: {} }
    'menus.index': { paramsTuple?: []; params?: {} }
    'menus.store': { paramsTuple?: []; params?: {} }
    'menus.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'menus.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'menus.reorder': { paramsTuple?: []; params?: {} }
    'auth.index': { paramsTuple?: []; params?: {} }
    'events.index': { paramsTuple?: []; params?: {} }
    'events.sync': { paramsTuple?: []; params?: {} }
    'media.index': { paramsTuple?: []; params?: {} }
    'media.store': { paramsTuple?: []; params?: {} }
    'media.destroy': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
    'media.show': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
  }
  GET: {
    'posts.index': { paramsTuple?: []; params?: {} }
    'posts.show': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'auth.me': { paramsTuple?: []; params?: {} }
    'stats.index': { paramsTuple?: []; params?: {} }
    'stats.tables': { paramsTuple?: []; params?: {} }
    'menus.index': { paramsTuple?: []; params?: {} }
    'auth.index': { paramsTuple?: []; params?: {} }
    'events.index': { paramsTuple?: []; params?: {} }
    'media.index': { paramsTuple?: []; params?: {} }
    'media.show': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
  }
  HEAD: {
    'posts.index': { paramsTuple?: []; params?: {} }
    'posts.show': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'auth.me': { paramsTuple?: []; params?: {} }
    'stats.index': { paramsTuple?: []; params?: {} }
    'stats.tables': { paramsTuple?: []; params?: {} }
    'menus.index': { paramsTuple?: []; params?: {} }
    'auth.index': { paramsTuple?: []; params?: {} }
    'events.index': { paramsTuple?: []; params?: {} }
    'media.index': { paramsTuple?: []; params?: {} }
    'media.show': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
  }
  POST: {
    'posts.store': { paramsTuple?: []; params?: {} }
    'auth.register': { paramsTuple?: []; params?: {} }
    'auth.login': { paramsTuple?: []; params?: {} }
    'auth.logout': { paramsTuple?: []; params?: {} }
    'menus.store': { paramsTuple?: []; params?: {} }
    'menus.reorder': { paramsTuple?: []; params?: {} }
    'events.sync': { paramsTuple?: []; params?: {} }
    'media.store': { paramsTuple?: []; params?: {} }
  }
  PUT: {
    'posts.update': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'menus.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  DELETE: {
    'posts.destroy': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'menus.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'media.destroy': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}