import { NextResponse } from 'next/server';
import { openApiSpec } from '@/lib/api/openapi';

/**
 * Handler GET untuk mengambil dokumentasi OpenAPI spec.
 */
export async function getOpenApiSpecApi() {
  return NextResponse.json(openApiSpec, {
    headers: { 'Content-Type': 'application/json' },
  });
}
