
/*
  See this article for details about custom errors:
  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
*/
class UserNotFoundError extends Error {
  constructor(msg:string,public errorCode ?:number) {
    super(msg)

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UserNotFoundError)
    }

    this.name = 'UserNotFoundError'
    this.errorCode = errorCode || 404;
    
  }
}

export {UserNotFoundError}