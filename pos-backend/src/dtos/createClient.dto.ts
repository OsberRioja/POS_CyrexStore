export type TipoClienteString = "PERSONA" | "EMPRESA";

export interface CreateClienteDTO {
  tipoCliente: TipoClienteString; // obligatorio: "PERSONA" | "EMPRESA"
  nombre: string;                 // obligatorio
  telefono: string;               // obligatorio
  genero?: string;                // opcional
  fechaNacimiento?: string;       // opcional, formato ISO (ej: "1990-05-20")
}
