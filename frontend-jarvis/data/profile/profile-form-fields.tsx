import { User, Phone, Mars, Cake } from "lucide-react";

export const profileFormFields = [
  {
    label: "Nombre",
    id: "firstName", //Nombre del campo en el objeto profile que viene del backend
    placeholder: "Tu nombre",
    Icon: <User size={16} className="text-orange-400" />,
    value: "",
    formatInput: "input", //identificador de si es tipo select, o por defecto label
  },
  {
    label: "Apellido",
    id: "lastName",
    placeholder: "Tu apellido",
    Icon: <User size={16} className="text-orange-400" />,
    value: "",
    formatInput: "input",
  },
  {
    label: "Usuario",
    id: "userName",
    placeholder: "Tu nombre de usuario",
    Icon: <User size={16} className="text-orange-400" />,
    value: "",
    formatInput: "input",
  },
  {
    label: "Teléfono",
    id: "phone",
    placeholder: "+56912345678",
    Icon: <Phone size={16} className="text-orange-400" />,
    value: "",
    formatInput: "input",
  },
  {
    label: "Fecha de nacimiento",
    id: "birthDate",
    placeholder: "",
    Icon: <Cake size={16} className="text-orange-400" />,
    value: new Date(),
    formatInput: "date",
  },
  {
    label: "Género",
    id: "gender",
    placeholder: "Sin especificar",
    Icon: <Mars size={16} className="text-orange-400" />,
    value: "",
    formatInput: "select",
  },
];

export const optionsGender = [
  "Sin especificar",
  "Masculino",
  "Femenino",
  "No binario",
  "Prefiero no decir",
] as const; //si hay error en slect puede ser por el as const

export type Gender = (typeof optionsGender)[number];
