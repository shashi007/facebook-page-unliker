import Ember from 'ember';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';

function transformResponse(data) {
  return data.map((item) => {
    return {
      type: "likes",
      id: item.id,
      attributes: {
        name: item.name,
        'created-time': item.created_time,
        link: item.link,
        about: item.about,
        'fan-count': item.fan_count
      }
    };
  });
}

export default Ember.Route.extend(AuthenticatedRouteMixin, {
  session: Ember.inject.service(),
  baseAPIUrl: Ember.computed('session', function() {
    const accessToken = this.get('session.session.authenticated.accessToken');
    return `https://graph.facebook.com/v2.7/me/likes?access_token=${accessToken}&limit=100&fields=link,name,about,created_time,fan_count`;
  }),
  getLikesFromUrl(url) {
    return Ember.$.ajax(url).then((response) => {
      if (response.paging && response.paging.next) {
        const transformedLikes = transformResponse(response.data);
        const payload = {
          data: transformedLikes
        };

        this.store.pushPayload('like', payload);

        const nextUrl = response.paging.next;

        return this.getLikesFromUrl(nextUrl);
      } else {
        let likes = this.store.peekAll('like');
        return likes;
      }
    }).catch((reason) => {
      console.log(reason);
      if(reason.status === 400) {
        this.get('session').invalidate();
        this.transitionToRoute('home');
      }
    });
  },
  model() {
    const baseApiUrl = this.get('baseAPIUrl');

    return this.getLikesFromUrl(baseApiUrl);
  }
});
