var request = require('supertest');
var should = require('should');
var testUtils = require("../../test/testUtils");
var agent = request.agent(testUtils.url);

var API_KEY_ADMIN = "";

describe('Testing SSO funcitonality', function(){
    describe('Accessing without login', function(){
        it('should redirect to login', function(done){
            API_KEY_ADMIN = testUtils.get("API_KEY_ADMIN");
            agent
            .get('/dashboard')
            .expect('location', '/login')
            .expect(302, done);
        });
    });
    
    describe('Login using SSO', function(){
        it('should login and redirect to provided url', function(done){
            agent
            .get('/sso/login?user='+testUtils.username+'&api_key='+API_KEY_ADMIN+'&redirect='+encodeURIComponent("http://google.com"))
            .expect('location', 'http://google.com')
            .expect(302, done);
        });
    });
    
    describe('Accessing logged in', function(){
        it('should success', function(done){
            agent
            .get('/dashboard')
            .expect(200, done);
        });
    });
    
    describe('Logout using SSO', function(){
        it('should logout and redirect to provided url', function(done){
            agent
            .get('/sso/logout?redirect='+encodeURIComponent("http://google.com"))
            .expect('location', 'http://google.com')
            .expect(302, done);
        });
    });
    
    describe('Accessing without login', function(){
        it('should redirect to login', function(done){
            agent
            .get('/dashboard')
            .expect('location', '/login')
            .expect(302, done);
        });
    });
});