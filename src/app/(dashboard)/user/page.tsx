import { auth0 } from "@/lib/auth0";
import { verifyJWT } from "@/lib/jwt";
import { cookies } from "next/headers";
import ProfileClient from "../../../components/user/profileClient";

export const dynamic = "force-dynamic"; // evita cache de página de perfil

export default async function UserPage() {
  // Verificar Auth0
  const auth0Session = await auth0.getSession();

  // Verificar JWT local si no hay Auth0
  let hasSession = !!auth0Session;
  if (!auth0Session) {
    const cookieStore = await cookies();
    const localToken = cookieStore.get("local-auth-token")?.value;
    if (localToken) {
      const payload = await verifyJWT(localToken);
      hasSession = !!payload;
    }
  }

  if (!hasSession) {
    return (
      <div className="card">
        <div className="card-body flex items-center justify-between">
          <div>
            <h2 className="card-title">No has iniciado sesión</h2>
            <p className="card-subtitle">
              Inicia sesión para ver y editar tu perfil.
            </p>
          </div>
          <a
            href="/login"
            className="btn btn-primary"
            aria-label="Iniciar sesión"
          >
            Iniciar sesión
          </a>
        </div>
      </div>
    );
  }

  return <ProfileClient />;
}
