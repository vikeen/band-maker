from djangoseo import seo


class Metadata(seo.Metadata):
    title = seo.Tag(max_length=68, head=True)
    keywords = seo.KeywordTag()
    description = seo.MetaTag(max_length=155)
    heading = seo.Tag(name="h1")
    subheading = seo.Tag(name="h2")
    extra = seo.Raw(head=True)
