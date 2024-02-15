import { getToken } from "./client";
import * as authAction from "@octokit/auth-action";
jest.mock("@octokit/auth-action", ()=>{
  return {
  createActionAuth: jest.fn(()=>jest.fn(()=>{ return {token:'my-fake-token'}}))
  }
})

describe('client',()=>{
  describe('getToken',()=>{
    const originalEnv = process.env
    const mockCreateActionAuth = authAction.createActionAuth as jest.MockedFunction<typeof authAction.createActionAuth> 
    afterEach(()=>{
       process.env = originalEnv
    })
    it('createAuthentication to be called',async ()=>{
      expect(getToken()).resolves.toBe('my-fake-token')
      expect(mockCreateActionAuth).toHaveBeenCalled()
    })
  })
})
