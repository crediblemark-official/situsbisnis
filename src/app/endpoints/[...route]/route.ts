import { NextRequest } from "next/server";
import { resolveEndpoint } from "../routes";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ route: string[] }> }) {
    const { route } = await params;
    const routePath = route.join("/");

    return resolveEndpoint(req, "GET", routePath, route);
}

export async function POST(req: Request, { params }: { params: Promise<{ route: string[] }> }) {
    const { route } = await params;
    const routePath = route.join("/");

    return resolveEndpoint(req, "POST", routePath, route);
}

export async function PUT(req: Request, { params }: { params: Promise<{ route: string[] }> }) {
    const { route } = await params;
    const routePath = route.join("/");

    return resolveEndpoint(req, "PUT", routePath, route);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ route: string[] }> }) {
    const { route } = await params;
    const routePath = route.join("/");

    return resolveEndpoint(req, "PATCH", routePath, route);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ route: string[] }> }) {
    const { route } = await params;
    const routePath = route.join("/");

    return resolveEndpoint(req, "DELETE", routePath, route);
}
