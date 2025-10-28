import { auth0 } from "@/lib/auth0";
import ProfileClient from "../../../components/user/profileClient";

export const dynamic = "force-dynamic"; // evita cache de página de perfil

export default async function UserPage() {
  const session = await auth0.getSession();

  if (!session) {
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
            href="/api/auth/login"
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
