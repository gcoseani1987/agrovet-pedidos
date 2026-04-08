import { create } from 'zustand'
import {
  sincronizarTodo,
  contarPedidosPendientes,
  contarClientesPendientes,
  getUltimaSync,
  type SyncStatus,
  type SyncStats,
} from '@/lib/sync'

interface SyncState {
  status: SyncStatus
  pendientes: number          // total (pedidos + clientes)
  pedidosPendientes: number
  clientesPendientes: number
  ultimaSync: string | null
  progreso: string | null
  stats: SyncStats | null
  // Actions
  sincronizar: () => Promise<void>
  actualizarPendientes: () => Promise<void>
  incrementarPendientes: () => void
}

export const useSyncStore = create<SyncState>((set, get) => ({
  status: 'idle',
  pendientes: 0,
  pedidosPendientes: 0,
  clientesPendientes: 0,
  ultimaSync: getUltimaSync(),   // carga del localStorage al arrancar
  progreso: null,
  stats: null,

  sincronizar: async () => {
    if (get().status === 'syncing') return

    set({ status: 'syncing', progreso: 'Iniciando...', stats: null })

    const resultado = await sincronizarTodo(msg => set({ progreso: msg }))

    const [pedidosPendientes, clientesPendientes] = await Promise.all([
      contarPedidosPendientes(),
      contarClientesPendientes(),
    ])

    set({
      status: resultado.status,
      stats: resultado.stats,
      progreso: null,
      ultimaSync: getUltimaSync(),
      pendientes: pedidosPendientes + clientesPendientes,
      pedidosPendientes,
      clientesPendientes,
    })

    // Volver a idle después de 3s si fue exitoso
    if (resultado.status === 'success') {
      setTimeout(() => set({ status: 'idle' }), 3000)
    }
  },

  actualizarPendientes: async () => {
    const [pedidosPendientes, clientesPendientes] = await Promise.all([
      contarPedidosPendientes(),
      contarClientesPendientes(),
    ])
    set({
      pendientes: pedidosPendientes + clientesPendientes,
      pedidosPendientes,
      clientesPendientes,
    })
  },

  incrementarPendientes: () => {
    set(state => ({
      pendientes: state.pendientes + 1,
      pedidosPendientes: state.pedidosPendientes + 1,
    }))
  },
}))
