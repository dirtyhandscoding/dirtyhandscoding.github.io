//requires jquery
var CommentSystem = {
	email_user:   "not set",
	email_domain: "not set",

	displayReplyTo: function(comment_content, slug, author) {
		/*
		if (slug === undefined) {
			$('#pcs-comment-form-display-replyto').hide();
			return undefined;
		}
		
		$('html, body').animate({ scrollTop: $("#pcs-comment-form").offset().top }, 1000);
		
		var newHtml = (''
			+ '<button style="float:right;" onclick="CommentSystem.cancelReply(); return false;" title="Cancel the reply">'
			+ 	'×'
			+ '</button>'
			+ 'This comment will be posted as a reply to \'<a title="'+comment_content+'" href="#comment-'+slug+'">'+author+'</a>\''
		);
		$('#pcs-comment-form-display-replyto').html(newHtml);
		$('#pcs-comment-form-display-replyto').show();
		*/
		
		var moveAfter;
		if (slug === undefined)
			moveAfter = $('#pcs-comment-notreply-helper');
		else {
			var jquery_escaped_id = slug.replace('.', '\\.');
			moveAfter = $('#comment-' + jquery_escaped_id + ' > .comment-body > .comment-self');
		}
		$('#pcs-comment-form').insertAfter(moveAfter);
		
		var newHtml;
		if (slug === undefined)
			newHtml = 'Add a comment on article';
		else {
			newHtml = (''
				+ 'Add a reply to <a title="'+comment_content+'" href="#comment-'+slug+'">'+author+'</a>'
				+ '<button id="pcs-comment-cancel-reply" onclick="CommentSystem.cancelReply(); return false;" title="Cancel the reply">'
				+ '<span class="nocss">Cancel</span>'
				+ '</button>'
			);
		}
		$('#pcs-comment-form legend').html(newHtml);
	},
	
	cancelReply: function() {
		$('#pcs-comment-form-input-replyto').val("");
		this.displayReplyTo(undefined);
	},

	setReply: function(slug, author) {
		slug   = decodeURIComponent(slug);
		author = decodeURIComponent(author);

		$('#pcs-comment-form-input-replyto').val(slug);

		var jquery_escaped_id = slug.replace('.', '\\.')
		var commentContent = $('#comment-' + jquery_escaped_id + ' .pcs-comment-content:first').text().trim()

		this.displayReplyTo(commentContent, slug, author);
	},

	getMailContents: function(slug) {
		var subject = 'Comment for \'' + slug + '\'' ;

		var now = new Date();
		tzo = -now.getTimezoneOffset(),
		dif = tzo >= 0 ? '+' : '-',
		pad = function(num) {
			norm = Math.abs(Math.floor(num));
			return (norm < 10 ? '0' : '') + norm;
		};
		var author = $("#pcs-comment-form-input-name").val();
		var body = ''
			+ 'Hey,\nI posted a new comment on ' + document.URL + '\n\n\n'
			+ 'Raw comment data:\n'
			+ '----------------------------------------\n'
			+ 'email: \n' // just that I don't forget to write it down
			+ 'date: ' + now.getFullYear()
					+ '-' + pad(now.getMonth()+1)
					+ '-' + pad(now.getDate())
					+ 'T' + pad(now.getHours())
					+ ':' + pad(now.getMinutes())
					+ dif + pad(tzo / 60)
					+ ':' + pad(tzo % 60) +'\n'
			+ 'author: ' + author + '\n';

		var replyto = $('#pcs-comment-form-input-replyto').val();
		if (replyto.length != 0)
		{
			body += 'replyto: ' + replyto + '\n'
		}

		var url = $("#pcs-comment-form-input-website").val();
		if (url.length != 0)
		{
			if(url.substr(0,7) != 'http://' && url.substr(0,8) != 'https://'){
				url = 'http://' + url;
			}
			body += 'website: ' + url + '\n';
		}
		var content = $("#pcs-comment-form-input-textarea").val();
		body += '\n'
			+ content + '\n'
			+ '----------------------------------------\n';
		var empty = $("#pcs-comment-form-input-empty").val();
		
		return {
			subject: subject,
			body: body,
			filled: author.length > 0 && content.length > 0 && empty.length == 0,
		};
	},
	
	getMailtoLink: function(slug) {
		var contents = this.getMailContents(slug);
		if (!contents.filled) {
			alert("Please specify at least author name and comment body!");
			return undefined;
		}

		var stupid = this.email_user + '@' + this.email_domain;
		var n = stupid.length;
		var seed = 1737641;
		var prng = function() {
			seed = (219 * seed) % 32749;
			return seed;
		}
		for (var i = 0; i < 100; i++) {
			var a = prng() % n;
			var b = prng() % n;
			if (a == b) continue;
			if (a > b) {
				var tmp = a;
				a = b;
				b = tmp;
			}
			stupid = stupid.substr(0, a) + stupid[b] + stupid.substr(a+1, b-a-1) + stupid[a] + stupid.substr(b+1);
		}
		var trash = [-3,6,0,2,-2,-3,-2,-20,-55,-1,-5,0,0,0,0,-10,1,39,69,-47,0,0,0,0,22,0,0,0,0,13,-17,-11,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-19,0,0,0,0,0,0,11,0,-20,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-15,0,0,0,0,0,0,0,0,0,0];
		for (var i = 0; i < trash.length; i++) {
			var a = prng() % n;
			var newCh = String.fromCharCode(stupid.charCodeAt(a) + trash[i]);
			stupid = stupid.substr(0, a) + newCh + stupid.substr(a+1);
		}

		var link = 'mailto:' + stupid + '?subject='
			+ encodeURIComponent(contents.subject)
			+ "&body="
			+ encodeURIComponent(contents.body.replace(/\r?\n/g, "\r\n"));
		return link;
	},
	
	viewEmail: function(slug) {
		var isEmail = $('#pcs-comment-form-button-message').hasClass('active');
		$('#pcs-comment-form-button-message').toggleClass('active');
		
		var oldTab = $('#pcs-comment-tab-message');
		var newTab = $('#pcs-comment-tab-inputs');
		if (!isEmail) {
			var tmp = oldTab; oldTab = newTab; newTab = tmp;
		}
		
		var oldTabHeight = oldTab.height();
		oldTab.toggle();
		newTab.toggle();
		var newTabHeight = newTab.height();
		var newAreaHeight = newTab.find('textarea').height();
		newTab.find('textarea').height(Math.max(oldTabHeight - (newTabHeight - newAreaHeight), 16));
		
		if (!isEmail) {
			var contents = this.getMailContents(slug);
			var mytextarea = $('#pcs-comment-tab-message textarea');
			mytextarea.text(contents.body);
			mytextarea.focus();
			mytextarea.select();
		}
		else
			$('#pcs-comment-tab-inputs textarea').focus();
	},

	collapsible: function(content, button) {
		//getting height of potentially hidden element: https://stackoverflow.com/a/2345813/556899
		var previousStyle = content.attr("style");
		content.css({position: 'absolute', visibility: 'hidden', display: 'block', maxHeight: 'none'});
		fullHeight = content.height() + 100;
		content.attr("style", previousStyle || "");

		var isExpanding = button.hasClass('collapsed');

		content.css({display: ''});
		content.css({maxHeight: (isExpanding ? 0 : fullHeight) + 'px'});
		content.css('maxHeight');
		content.css({maxHeight: (isExpanding ? fullHeight : 0) + 'px'});
		content.bind("transitionend", function() {
			content.css({display: (isExpanding ? '' : 'none'), maxHeight: ''});
		});

		button.toggleClass('collapsed');
	},
}
