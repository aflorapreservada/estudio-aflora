export function appendImageReferences(
  formData: FormData,
  original: File,
  modelo: File | null,
): void {
  // Multiple references must use array syntax, with the original piece first.
  const field = modelo ? "image[]" : "image";
  formData.append(field, original);
  if (modelo) formData.append(field, modelo);
}
