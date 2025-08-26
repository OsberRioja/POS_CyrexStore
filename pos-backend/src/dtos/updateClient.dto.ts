import { TipoClienteString } from "./createClient.dto";

export interface UpdateClienteDTO {
  tipoCliente?: TipoClienteString;
  nombre?: string;
  telefono?: string;
  genero?: string;
  fechaNacimiento?: string; // ISO string
}
