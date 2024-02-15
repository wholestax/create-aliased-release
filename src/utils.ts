export const isError = (error:unknown):error is Error =>{
  return error instanceof Error
}

export const parseBooleanFromString = (input: string): boolean => {
  if (input.toLowerCase() === "true") {
    return true;
  } else if (input.toLowerCase() === "false" || input == "") {
    return false;
  } else {
    throw new Error("Input string must be 'true' or 'false'.");
  }
}
