export interface ButtonCustomType {
  label?: string;
  action?: () => void;
  classNameCustom?: string;
  variant?:
    | "secondary"
    | "link"
    | "outline"
    | "default"
    | "ghost"
    | "destructive"
    | null
    | undefined;
}
