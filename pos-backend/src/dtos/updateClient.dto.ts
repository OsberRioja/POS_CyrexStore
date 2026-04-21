import { TipoClienteString } from "./createClient.dto";

export interface UpdateClienteDTO {
  tipoCliente?: TipoClienteString;
  nombre?: string;
  countryCode?: string;
  country?: string;
  phone?: string;
  telefono?: string;
  genero?: string;
  fechaNacimiento?: string;
}
