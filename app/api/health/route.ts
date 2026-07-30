import { NextResponse } from 'next/server'

export function GET() {
  return NextResponse.json({ status: 'ok', service: 'nexus-tasks', timestamp: new Date().toISOString() })
}
