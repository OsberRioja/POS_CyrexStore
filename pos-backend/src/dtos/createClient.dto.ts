export type TipoClienteString = "PERSONA" | "EMPRESA";

export interface CreateClienteDTO {
  tipoCliente: TipoClienteString;
  nombre: string;
  countryCode: string;
  country: string;
  phone: string;
  telefono?: string;
  genero?: string;
  fechaNacimiento?: string;
}
